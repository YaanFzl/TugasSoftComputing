from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

router = APIRouter(prefix="/api/fuzzy", tags=["fuzzy"])

class TippingRequest(BaseModel):
    quality: float
    service: float

@router.post("/tipping")
async def calculate_tip(req: TippingRequest):
    # New Antecedent/Consequent objects
    quality = ctrl.Antecedent(np.arange(0, 11, 1), 'quality')
    service = ctrl.Antecedent(np.arange(0, 11, 1), 'service')
    tip = ctrl.Consequent(np.arange(0, 26, 1), 'tip')

    # Auto-membership function population
    quality.automf(3)
    service.automf(3)

    # Custom membership functions for tip
    tip['low'] = fuzz.trimf(tip.universe, [0, 0, 13])
    tip['medium'] = fuzz.trimf(tip.universe, [0, 13, 25])
    tip['high'] = fuzz.trimf(tip.universe, [13, 25, 25])

    # Rules
    rule1 = ctrl.Rule(quality['poor'] | service['poor'], tip['low'])
    rule2 = ctrl.Rule(service['average'], tip['medium'])
    rule3 = ctrl.Rule(service['good'] | quality['good'], tip['high'])

    # Control System
    tipping_ctrl = ctrl.ControlSystem([rule1, rule2, rule3])
    tipping = ctrl.ControlSystemSimulation(tipping_ctrl)

    # Pass inputs
    tipping.input['quality'] = req.quality
    tipping.input['service'] = req.service

    # Compute
    try:
        tipping.compute()
        result = tipping.output['tip']
    except:
        result = 0.0

    return {"tip": result}
