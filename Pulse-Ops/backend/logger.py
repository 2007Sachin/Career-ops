import structlog
import logging
import sys

def setup_logger():
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )

    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

setup_logger()
logger = structlog.get_logger("pulse_ops")

def log_agent_event(user_id: str, agent_name: str, action: str, duration_ms: int, status: str, error: str = None, **kwargs):
    """
    Helper for standardized JSON logging across agents.
    """
    event_data = {
        "user_id": user_id,
        "agent_name": agent_name,
        "action": action,
        "duration_ms": duration_ms,
        "status": status,
        **kwargs
    }
    if error:
        event_data["error_details"] = error
        logger.error(f"Agent Action Failed: {action}", **event_data)
    else:
        logger.info(f"Agent Action Success: {action}", **event_data)
