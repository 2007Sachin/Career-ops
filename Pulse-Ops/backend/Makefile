.PHONY: test test-unit test-integration test-api lint format

test:
	pytest tests/ -v

test-unit:
	pytest tests/test_unit.py -v

test-integration:
	pytest tests/test_integration.py -v

test-api:
	pytest tests/test_api.py -v

lint:
	ruff check .

format:
	black .
