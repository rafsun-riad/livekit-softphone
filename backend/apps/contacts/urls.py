from django.urls import path

from .views import (
    ContactBlockView,
    ContactDetailView,
    ContactListCreateView,
    ContactRelationshipView,
    ContactSaveView,
    ContactUnblockView,
)

urlpatterns = [
    path("", ContactListCreateView.as_view(), name="contacts-list-create"),
    path("save/", ContactSaveView.as_view(), name="contacts-save"),
    path("block/", ContactBlockView.as_view(), name="contacts-block"),
    path("unblock/", ContactUnblockView.as_view(), name="contacts-unblock"),
    path(
        "relationship/<uuid:target_user_id>/",
        ContactRelationshipView.as_view(),
        name="contacts-relationship",
    ),
    path("<uuid:contact_id>/", ContactDetailView.as_view(), name="contacts-detail"),
]
