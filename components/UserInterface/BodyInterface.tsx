import React from 'react'

const BodyInterface = () => {
    return (
        <div>
            <div className='bg-amber-600'>
                <div className="bg-amber-800 flex flex-col gap-4 w-80 mt-50 ml-10">
                    <h1 className="text-5xl font-bold text-purple-700">Check-in</h1>
                    <h2 className="text-2xl text-purple-400">Check in for class</h2>
                    <p className="text-purple-300">
                        To make the lives of students easier<br />
                        when checking in to class.
                    </p>
                    <button className="bg-purple-500 h-auto w-60 text-white text-xl font-bold p-3 rounded-2xl hover:bg-purple-400 transition">
                        Start Check-in
                    </button>
                </div>
            </div>
        </div>
    )
}

export default BodyInterface