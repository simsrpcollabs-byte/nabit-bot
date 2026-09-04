from datetime import date


def stage_for_months(age_months: int) -> str:
    if age_months < 0 or age_months > 215:
        raise ValueError("KIDDO supports ages birth through 17.")
    if age_months <= 11:
        return "Infant"
    if age_months <= 23:
        return "Young Toddler"
    if age_months <= 47:
        return "Toddler"
    if age_months <= 71:
        return "Preschool"
    if age_months <= 107:
        return "Early Childhood"
    if age_months <= 143:
        return "Middle Childhood"
    if age_months <= 179:
        return "Early Adolescence"
    return "Older Teen"


def age_label(age_months: int) -> str:
    if age_months < 24:
        return f"{age_months} month{'s' if age_months != 1 else ''}"
    years, months = divmod(age_months, 12)
    return f"{years}y {months}m" if months else f"{years} years"


def months_from_birthday(birthday: date, today: date | None = None) -> int:
    today = today or date.today()
    months = (today.year - birthday.year) * 12 + today.month - birthday.month
    if today.day < birthday.day:
        months -= 1
    return max(0, months)
