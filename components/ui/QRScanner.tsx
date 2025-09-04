import React from 'react';
import { ScanQrCode } from "lucide-react";
import { motion } from "framer-motion";

interface ScanQRButtonProps {
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}

const ScanQRButton: React.FC<ScanQRButtonProps> = ({
    onClick,
    disabled = false,
}) => {
    return (
        <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
        >
            <button
                className="border bg-neutral-50 rounded-2xl inset-shadow-sm p-3"
                onClick={onClick}
                disabled={disabled}
            >
                <ScanQrCode className="text-purple-600" />
            </button>
        </motion.div>
    );
};

export default ScanQRButton;