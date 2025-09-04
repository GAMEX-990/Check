'use client'
import Loader from '@/components/Loader/Loader'
import { BackgroundDecorations } from '@/components/ui/BackgroundDecorations'
import { auth } from '@/lib/firebase'
import React, { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'

const Docspage = () => {
    const [, loading] = useAuthState(auth);
    const [delayDone, setdelayDone] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setdelayDone(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    if (loading || !delayDone) {
        return <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Loader />
        </div>
    }
    return (
        <div>
            <BackgroundDecorations />
        </div>
    )
}

export default Docspage