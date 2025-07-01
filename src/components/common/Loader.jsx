import React from 'react';
import styles from './Loader.module.css';

const Loader = ({ size = 'medium', color = 'primary' }) => {
    return (
        <div className={`${styles.loader} ${styles[size]} ${styles[color]}`}>
            <div className={styles.spinner}></div>
        </div>
    );
};

export default Loader;