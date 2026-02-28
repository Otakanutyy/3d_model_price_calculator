"""
Celery task producer — sends tasks to the Celery worker via Redis.
The server doesn't run Celery itself, it just publishes messages.
"""

from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
)


def enqueue_process_model(model_id: str, file_path: str) -> str:
    """Enqueue a model processing task. Returns the Celery task ID."""
    result = celery_app.send_task(
        "tasks.process_model",
        args=[model_id, file_path],
    )
    return result.id
