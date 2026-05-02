FROM python:3.11-slim

WORKDIR /app

# Install poetry
RUN pip install poetry==1.7.1

# Copy project definition
COPY pyproject.toml poetry.lock* /app/

# Config poetry to not create virtualenv inside docker
RUN poetry config virtualenvs.create false

# Install dependencies
RUN poetry install --no-interaction --no-ansi --no-root

# Copy application code
COPY ./backend /app/backend
COPY ./agents /app/agents
COPY ./shared /app/shared

# Run the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
