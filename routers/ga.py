from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Dict
import random
import numpy as np
import pandas as pd
import io

router = APIRouter(prefix="/api/ga", tags=["ga"])

# --- Models ---
class KnapsackItem(BaseModel):
    name: str
    weight: int
    value: int

class KnapsackRequest(BaseModel):
    capacity: int
    items: List[KnapsackItem]
    pop_size: int = 10
    generations: int = 20
    crossover_rate: float = 0.8
    mutation_rate: float = 0.1
    elitism: bool = True

class TSPRequest(BaseModel):
    cities: List[str]
    dist_matrix: List[List[float]]
    pop_size: int = 100
    generations: int = 200
    tournament_k: int = 5
    pc: float = 0.8
    pm: float = 0.2
    elite_size: int = 1

# --- Shared Logic ---

def run_tsp_algorithm(cities, dist_matrix, pop_size, generations, tournament_k, pc, pm, elite_size):
    n_cities = len(cities)
    dist_matrix = np.array(dist_matrix)

    def route_distance(route):
        return sum(dist_matrix[route[i], route[(i+1)%n_cities]] for i in range(n_cities))

    def create_individual():
        ind = list(range(n_cities))
        random.shuffle(ind)
        return ind

    def tournament_selection(pop):
        k = random.sample(pop, tournament_k)
        return min(k, key=route_distance)

    def ordered_crossover(p1, p2):
        a, b = sorted(random.sample(range(n_cities), 2))
        child = [-1]*n_cities
        child[a:b+1] = p1[a:b+1]
        p2_idx = 0
        for i in range(n_cities):
            if child[i] == -1:
                while p2[p2_idx] in child: p2_idx += 1
                child[i] = p2[p2_idx]
        return child

    def swap_mutation(ind):
        a, b = random.sample(range(n_cities), 2)
        ind[a], ind[b] = ind[b], ind[a]

    pop = [create_individual() for _ in range(pop_size)]
    best = min(pop, key=route_distance)
    best_dist = route_distance(best)
    history = []

    for g in range(generations):
        pop = sorted(pop, key=route_distance)
        if route_distance(pop[0]) < best_dist:
            best = pop[0]
            best_dist = route_distance(best)
        
        new_pop = pop[:elite_size]
        while len(new_pop) < pop_size:
            p1 = tournament_selection(pop)
            p2 = tournament_selection(pop)
            child = ordered_crossover(p1, p2) if random.random() < pc else p1[:]
            if random.random() < pm: swap_mutation(child)
            new_pop.append(child)
        pop = new_pop
        history.append(best_dist)

    best_route_names = [cities[i] for i in best]
    return {
        "best_distance": best_dist,
        "best_route": best_route_names,
        "history": history
    }

# --- Knapsack Logic ---
@router.post("/knapsack")
async def solve_knapsack(req: KnapsackRequest):
    items_dict = {item.name: {'weight': item.weight, 'value': item.value} for item in req.items}
    item_list = list(items_dict.keys())
    n_items = len(item_list)

    def decode(chromosome):
        total_weight = 0
        total_value = 0
        chosen_items = []
        for gene, name in zip(chromosome, item_list):
            if gene == 1:
                total_weight += items_dict[name]['weight']
                total_value += items_dict[name]['value']
                chosen_items.append(name)
        return chosen_items, total_weight, total_value

    def fitness(chromosome):
        _, total_weight, total_value = decode(chromosome)
        if total_weight <= req.capacity:
            return total_value
        else:
            return 0

    def roulette_selection(population, fitnesses):
        total_fit = sum(fitnesses)
        if total_fit == 0: return random.choice(population)
        pick = random.uniform(0, total_fit)
        current = 0
        for chrom, fit in zip(population, fitnesses):
            current += fit
            if current >= pick: return chrom
        return population[-1]

    def crossover(p1, p2):
        point = random.randint(1, len(p1) - 1)
        return p1[:point] + p2[point:], p2[:point] + p1[point:]

    def mutate(chromosome):
        return [1 - g if random.random() < req.mutation_rate else g for g in chromosome]

    population = [[random.randint(0, 1) for _ in range(n_items)] for _ in range(req.pop_size)]
    best_history = []

    for gen in range(req.generations):
        fitnesses = [fitness(ch) for ch in population]
        best_idx = fitnesses.index(max(fitnesses))
        best_chrom = population[best_idx]
        best_items, w, v = decode(best_chrom)
        
        best_history.append({'generation': gen+1, 'fitness': fitnesses[best_idx], 'value': v, 'weight': w})

        new_pop = [best_chrom] if req.elitism else []
        while len(new_pop) < req.pop_size:
            p1 = roulette_selection(population, fitnesses)
            p2 = roulette_selection(population, fitnesses)
            c1, c2 = crossover(p1, p2) if random.random() < req.crossover_rate else (p1[:], p2[:])
            new_pop.extend([mutate(c1), mutate(c2)])
        population = new_pop[:req.pop_size]

    return {"history": best_history, "best_items": best_items, "final_value": v, "final_weight": w}

# --- TSP Logic ---
@router.post("/tsp")
async def solve_tsp(req: TSPRequest):
    return run_tsp_algorithm(
        req.cities, req.dist_matrix, req.pop_size, req.generations,
        req.tournament_k, req.pc, req.pm, req.elite_size
    )

@router.post("/tsp/upload")
async def solve_tsp_upload(
    file: UploadFile = File(...),
    pop_size: int = Form(100),
    generations: int = Form(200),
    tournament_k: int = Form(5),
    pc: float = Form(0.8),
    pm: float = Form(0.2),
    elite_size: int = Form(1)
):
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents), index_col=0)
        cities = list(df.index)
        dist_matrix = df.values.astype(float).tolist()
        
        return run_tsp_algorithm(
            cities, dist_matrix, pop_size, generations,
            tournament_k, pc, pm, elite_size
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid file: {str(e)}")
