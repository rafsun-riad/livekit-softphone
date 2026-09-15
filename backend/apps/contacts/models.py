from apps.common.models import UUIDTimeStampedModel
from django.conf import settings
from django.db import models
from django.db.models import Q


class ContactStatus(models.TextChoices):
    ACCEPTED = "accepted", "Accepted"
    PENDING = "pending", "Pending"
    REJECTED = "rejected", "Rejected"
    BLOCKED = "blocked", "Blocked"


class Contact(UUIDTimeStampedModel):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="contacts",
    )
    contact_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="contact_of",
    )
    status = models.CharField(
        max_length=20,
        choices=ContactStatus.choices,
        default=ContactStatus.ACCEPTED,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "contact_user"],
                name="contacts_unique_owner_contact_user",
            ),
            models.CheckConstraint(
                condition=~Q(owner=models.F("contact_user")),
                name="contacts_owner_not_self",
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.owner_id}:{self.contact_user_id}:{self.status}"
