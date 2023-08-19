## development
### modify .env
```bash
cp .env-example .env
python3 -mvenv venv
source venv/bin/activate
pip install -r requirements.txt
python3 eupnea.py
```

## build
```bash
source venv/bin/activate
pip install -r requirements-dev.txt
pyinstaller --onefile eupnea.py
```
