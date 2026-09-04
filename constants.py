AGE_STAGES = [
    (0, 11, "Infant"),
    (12, 23, "Young Toddler"),
    (24, 47, "Toddler"),
    (48, 71, "Preschool"),
    (72, 107, "Early Childhood"),
    (108, 143, "Middle Childhood"),
    (144, 179, "Early Adolescence"),
    (180, 215, "Older Teen"),
]

TEMPERAMENTS = {
    "Infant": ["Easy Baby", "Sensitive Baby", "High-Needs Baby", "Curious Baby", "Social Baby", "Cautious Baby", "Independent Baby", "Unpredictable Baby"],
    "Young Toddler": ["Easygoing", "Busy Explorer", "Clingy/Sensitive", "Fearless", "Slow-to-Warm", "Strong-Willed", "Social Butterfly", "Quiet Observer"],
    "Toddler": ["Easygoing", "Spirited", "Independent", "Sensitive", "Cautious", "Social", "Strong-Willed", "Emotional", "Adventurous", "Reserved"],
    "Preschool": ["Outgoing", "Shy", "Imaginative", "Strong-Willed", "Sensitive", "Easygoing", "Energetic", "Cautious", "Independent", "Affectionate", "Leader", "People-Pleaser"],
    "Early Childhood": ["Social", "Reserved", "Sensitive", "Confident", "Cautious", "Adventurous", "Competitive", "Cooperative", "Independent", "Approval-Seeking", "Strong-Willed", "Easygoing"],
    "Middle Childhood": ["Outgoing", "Introverted", "Independent", "Sensitive", "Confident", "Cautious", "Competitive", "People-Pleasing", "Strong-Willed", "Laid-Back", "Responsible", "Impulsive", "Socially Driven", "Private"],
    "Early Adolescence": ["Independent", "Social", "Reserved", "Sensitive", "Rebellious", "Easygoing", "Driven", "Impulsive", "Cautious", "Approval-Seeking", "Private", "Dramatic", "Responsible", "Competitive", "People-Pleasing"],
    "Older Teen": ["Independent", "Driven", "Laid-Back", "Social", "Private", "Reserved", "Sensitive", "Strong-Willed", "Impulsive", "Cautious", "Responsible", "Rebellious", "Competitive", "People-Pleasing", "Confident", "Insecure", "Protective", "Emotionally Intense"],
}

TRAITS = [
    "Affectionate", "Curious", "Funny", "Silly", "Mischievous", "Stubborn", "Gentle", "Observant", "Dramatic", "Shy", "Talkative", "Bossy", "Creative", "Competitive", "Protective", "Patient", "Impatient", "Helpful", "Adventurous", "Cautious", "Friendly", "Sarcastic", "Sensitive", "Responsible", "Impulsive", "Neat", "Messy", "Imaginative", "Studious", "Athletic", "Easily Embarrassed", "Attention-Seeking"
]

MOODS = ["Normal", "Happy", "Excited", "Tired", "Hungry", "Sick", "Teething", "Overstimulated", "Upset", "Anxious", "Bored", "Hyper", "Cranky"]

DESTINATIONS = ["Daycare", "Preschool", "School", "Grandparent", "Babysitter", "Other Parent", "Relative", "Playdate", "Friend's House", "Church/Nursery", "Camp", "Extracurricular", "Appointment", "Custom"]

SUMMARY_STYLES = ["Quick", "Standard", "Detailed"]

STAGE_PROGRESSION = {
    "Easy Baby": ["Easygoing"], "Sensitive Baby": ["Clingy/Sensitive", "Sensitive"], "High-Needs Baby": ["Strong-Willed", "Spirited"],
    "Curious Baby": ["Busy Explorer", "Adventurous"], "Social Baby": ["Social Butterfly", "Social"], "Cautious Baby": ["Slow-to-Warm", "Cautious"],
    "Independent Baby": ["Busy Explorer", "Independent"], "Unpredictable Baby": ["Spirited", "Emotional"],
}
