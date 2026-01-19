import React from 'react';

export interface PhotonProperties {
    name?: string;
    street?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    housenumber?: string;
    display_name?: string;
}

export interface PhotonSuggestion {
    properties: PhotonProperties;
}

export interface AddressAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
    touched?: boolean;
}
