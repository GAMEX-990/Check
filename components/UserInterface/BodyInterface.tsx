import React from 'react'

const BodyInterface = () => {
    return (
        <div>
            <div className="flex flex-col space-y-4 max-w-md p-20 pt-40">
                <h1 className="text-5xl font-bold text-purple-700">Check-in</h1>
                <h2 className="text-2xl text-purple-400">Check in for class</h2>
                <p className="text-purple-300">
                    To make the lives of students easier<br />
                    when checking in to class.
                </p>
                <button className="bg-purple-500 text-white text-xl font-bold p-3 rounded-2xl hover:bg-purple-400 transition">
                    Start Check-in
                </button>
            </div>
        </div>
    )
}

export default BodyInterface