# 

## Setup

### Create virtual environment
```bash
python -m venv venv
```

### Activate the virtual environment
#### Windows
```bash
.\venv\Scripts\activate
```

#### macOS/Linux
```bash
source venv/bin/activate
```

### Install dependencies
```bash
pip install -r requirements.txt
```

### Run FastAPI Server
```bash
uvicorn main:app --reload
```
