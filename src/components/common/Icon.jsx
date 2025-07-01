;import React from 'react';
import * as Icons from 'react-icons/fa';

const Icon = ({ name, size = 16, ...props }) => {
    const IconComponent = Icons[`Fa${name}`];

    if (!IconComponent) {
        console.warn(`Icon "Fa${name}" not found`);
        return null;
    }

    return <IconComponent size={size} {...props} />;
};

export default Icon;