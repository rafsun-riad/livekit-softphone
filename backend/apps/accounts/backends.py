from __future__ import annotations

from django.contrib.auth.backends import ModelBackend
from django.core.exceptions import ValidationError

from .models import User, normalize_phone_number


class PhoneNumberModelBackend(ModelBackend):
    def authenticate(
        self,
        request,
        username=None,
        password=None,
        phone_number=None,
        phone_number_normalized=None,
        **kwargs,
    ):
        if password is None:
            return None

        candidate = (
            phone_number_normalized
            or phone_number
            or username
            or kwargs.get(User.USERNAME_FIELD)
        )

        if candidate:
            try:
                normalized_candidate = normalize_phone_number(str(candidate))
            except ValidationError:
                normalized_candidate = str(candidate).strip()

            user = User.objects.filter(
                phone_number_normalized=normalized_candidate,
            ).first()
            if (
                user
                and user.check_password(password)
                and self.user_can_authenticate(user)
            ):
                return user

        return super().authenticate(
            request,
            username=username,
            password=password,
            **kwargs,
        )
