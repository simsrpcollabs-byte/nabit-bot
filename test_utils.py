from utils import stage_for_months, age_label

def test_stages():
    assert stage_for_months(0) == "Infant"
    assert stage_for_months(11) == "Infant"
    assert stage_for_months(12) == "Young Toddler"
    assert stage_for_months(24) == "Toddler"
    assert stage_for_months(48) == "Preschool"
    assert stage_for_months(72) == "Early Childhood"
    assert stage_for_months(108) == "Middle Childhood"
    assert stage_for_months(144) == "Early Adolescence"
    assert stage_for_months(180) == "Older Teen"
    assert stage_for_months(215) == "Older Teen"

def test_age_label():
    assert age_label(8) == "8 months"
    assert age_label(12) == "12 months"
    assert age_label(24) == "2 years"
    assert age_label(29) == "2y 5m"
