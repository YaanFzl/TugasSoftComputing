from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/sugeno", tags=["sugeno"])

class ProductionRequest(BaseModel):
    demand: float
    stock: float

@router.post("/predict")
async def predict_production(req: ProductionRequest):
    # Fuzzification
    mu_demand_turun = max(0, (5000 - req.demand) / 5000)
    mu_demand_naik = max(0, req.demand / 5000)
    
    mu_stock_sedikit = max(0, (500 - req.stock) / 500)
    mu_stock_banyak = max(0, req.stock / 500)
    
    # Rules & Inference (Min)
    # R1: IF Turun AND Sedikit THEN z=5000
    alpha1 = min(mu_demand_turun, mu_stock_sedikit)
    z1 = 5000
    
    # R2: IF Turun AND Banyak THEN z=2500
    alpha2 = min(mu_demand_turun, mu_stock_banyak)
    z2 = 2500
    
    # R3: IF Naik AND Sedikit THEN z=7500
    alpha3 = min(mu_demand_naik, mu_stock_sedikit)
    z3 = 7500
    
    # R4: IF Naik AND Banyak THEN z=5000
    alpha4 = min(mu_demand_naik, mu_stock_banyak)
    z4 = 5000
    
    # Defuzzification (Weighted Average)
    numerator = (alpha1 * z1) + (alpha2 * z2) + (alpha3 * z3) + (alpha4 * z4)
    denominator = alpha1 + alpha2 + alpha3 + alpha4
    
    result = numerator / denominator if denominator != 0 else 0
    
    return {
        "production": int(result),
        "alphas": {
            "R1 (Turun-Sedikit)": alpha1,
            "R2 (Turun-Banyak)": alpha2,
            "R3 (Naik-Sedikit)": alpha3,
            "R4 (Naik-Banyak)": alpha4
        }
    }
