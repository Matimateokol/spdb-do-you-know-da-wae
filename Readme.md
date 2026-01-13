
# How to run project for the first time?

DATABASE:
```cd database```
```./setup_db.sh```

BACKEND:
```cd backend```
```python -m venv venv```
```.\venv\Scripts\Activate```
```pip install -r requirements.txt```
```cd spdb_backend```
```python manage.py migrate```
```python manage.py runserver```


FRONTEND:
```cd frontend-do-you-know-da-wae```
```yarn install```

```yarn run dev```

# How to run project each sequent time?

DATABASE:
```cd database```
```docker-compose start```

BACKEND:
```cd backend```
```.\venv\Scripts\Activate```
```cd spdb_backend```
```python manage.py runserver```

FRONTEND:
```cd frontend-do-you-know-da-wae```
```yarn run dev```