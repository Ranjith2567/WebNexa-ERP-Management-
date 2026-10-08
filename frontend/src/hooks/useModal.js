import { useState } from "react";

const useModal = (initialState = false) => {
    const [isOpen, setIsOpen] =
        useState(initialState);

    const openModal = () => {
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    const toggleModal = () => {
        setIsOpen((current) => !current);
    };

    return {
        isOpen,
        openModal,
        closeModal,
        toggleModal,
    };
};

export default useModal;