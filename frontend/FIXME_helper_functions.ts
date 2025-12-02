// Quick fix for getSeverityColor and getStatusColor functions
// This file contains the corrected versions with null checks

const getStatusColor = (status: string | undefined | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'warning': return 'bg-yellow-100 text-yellow-800';
        case 'audited': return 'bg-red-100 text-red-800';
        case 'inactive': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const getSeverityColor = (severity: string | undefined | null) => {
    if (!severity) return 'bg-gray-100 text-gray-800';
    switch (severity.toLowerCase()) {
        case 'low': return 'bg-blue-100 text-blue-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'high': return 'bg-orange-100 text-orange-800';
        case 'critical': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

// Replace lines 423-441 in UserDetailsPage.tsx with these functions
