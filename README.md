## Installation
#### ● Clone github repository and navigate to directory
#### ● Navigate to /backend
#### ● Create a virtual environment and activate it
     python -m venv venv
     source venv/bin/activate # For Windows: venv\Scripts\activate
#### ● Install dependencies
     pip install -r requirements.txt
#### ● Navigate to /api
#### ● Run FastAPI server
     uvicorn main:app --reload
#### ● On another terminal, navigate to /frontend
#### ● Install dependencies
     npm install
#### ● Run NextJS website and visit http://localhost:3000
     npm run dev
