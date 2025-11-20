from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np

router = APIRouter(prefix="/api/nn", tags=["nn"])

class TrainRequest(BaseModel):
    gate: str # AND, OR, XOR
    epochs: int = 1000
    learning_rate: float = 0.1

@router.post("/train")
async def train_nn(req: TrainRequest):
    # Dataset
    inputs = np.array([[0,0], [0,1], [1,0], [1,1]])
    
    if req.gate == "AND":
        expected = np.array([[0], [0], [0], [1]])
    elif req.gate == "OR":
        expected = np.array([[0], [1], [1], [1]])
    elif req.gate == "XOR":
        expected = np.array([[0], [1], [1], [0]])
    else:
        expected = np.array([[0], [0], [0], [0]])

    # Initialize
    np.random.seed(42)
    input_size = 2
    hidden_size = 4 # Needed for XOR
    output_size = 1
    
    w1 = np.random.uniform(size=(input_size, hidden_size))
    b1 = np.random.uniform(size=(1, hidden_size))
    w2 = np.random.uniform(size=(hidden_size, output_size))
    b2 = np.random.uniform(size=(1, output_size))

    def sigmoid(x): return 1 / (1 + np.exp(-x))
    def sigmoid_deriv(x): return x * (1 - x)

    loss_history = []

    # Training Loop
    for i in range(req.epochs):
        # Forward
        hidden_layer = sigmoid(np.dot(inputs, w1) + b1)
        output_layer = sigmoid(np.dot(hidden_layer, w2) + b2)
        
        # Loss (MSE)
        error = expected - output_layer
        if i % (req.epochs // 10) == 0:
            loss_history.append(float(np.mean(np.square(error))))

        # Backprop
        d_output = error * sigmoid_deriv(output_layer)
        error_hidden = d_output.dot(w2.T)
        d_hidden = error_hidden * sigmoid_deriv(hidden_layer)
        
        # Update
        w2 += hidden_layer.T.dot(d_output) * req.learning_rate
        b2 += np.sum(d_output, axis=0, keepdims=True) * req.learning_rate
        w1 += inputs.T.dot(d_hidden) * req.learning_rate
        b1 += np.sum(d_hidden, axis=0, keepdims=True) * req.learning_rate

    # Final Prediction
    hidden_final = sigmoid(np.dot(inputs, w1) + b1)
    final_output = sigmoid(np.dot(hidden_final, w2) + b2)
    
    predictions = []
    for i in range(len(inputs)):
        predictions.append({
            "input": f"{inputs[i][0]}, {inputs[i][1]}",
            "target": int(expected[i][0]),
            "prediction": float(final_output[i][0])
        })

    return {
        "loss_history": loss_history,
        "predictions": predictions
    }
