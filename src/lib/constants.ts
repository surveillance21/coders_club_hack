export const CONFIDENCE_THRESHOLD = 0.70;

export const CATEGORIES = [
    'Road Damage',
    'Water Supply',
    'Electricity',
    'Garbage or Sanitation',
    'Drainage',
    'Public Safety',
    'Other'
];

export const DEPARTMENT_MAP: Record<string, string> = {
    'Road Damage': 'Public Works Department',
    'Water Supply': 'Water Board',
    'Electricity': 'Electricity Department',
    'Garbage or Sanitation': 'Sanitation Department',
    'Drainage': 'Municipal Drainage Department',
    'Public Safety': 'Police Department',
    'Other': 'Admin Review'
};

export const STATUSES = [
    'Submitted',
    'Under Review',
    'Assigned',
    'In Progress',
    'Resolved',
    'Escalated'
];
