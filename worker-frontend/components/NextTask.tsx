"use client"
import { BACKEND_URL } from '@/utils';
import axios from 'axios';
import React, { useEffect, useState } from 'react'

interface Task{
    "id":number,
    "options":{
        "id":number,
        "img_url":string,
        "task_id":number
    }[],
    "title":string,
    "amount":number
}

function NextTask() {
    const [currentTask, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true); 
    const [submitting, setSubmission] = useState(false); 

    useEffect(() => {
        setLoading(true);
        axios.get(`${BACKEND_URL}/v1/worker/nextTask`, {
            headers: {
                "Authorization": localStorage.getItem("token")
            }
        }).then(res => {
                setTask(res.data.task);
                setLoading(false);
             })
             .catch(e => {
                setLoading(false)
                setTask(null)
            })
    },[])

    if (loading) {
        return <div>
            Loading...
        </div>
    }

    if (!currentTask) {
        return <div className="h-screen flex justify-center flex-col">
            <div className="flex justify-center text-violet-300 font-thin">
            NO tasks available at this moment. plssss Check back in some time ...!!
            </div>
        </div>
    }

  return (
    <div>
        <div className='text-xl pt-10 flex justify-center text-violet-500 font-thin'>
            {currentTask.title}{submitting && " submitting..."}
        </div>
        <div className='flex justify-center pt-5'>
            {currentTask.options.map(option => <Option imageUrl={option.img_url} onSelect={async () => {
                setSubmission(true);
                const res = await axios.post(`${BACKEND_URL}/v1/worker/submissions`, {
                    taskId: currentTask.id.toString(),
                    selection: option.id.toString()
                },{
                    headers: {
                        "Authorization": localStorage.getItem("token")
                    }
                });

                const nextTask = res.data.nextTask;
                if (nextTask) {
                    setTask(nextTask);
                } else {
                    setTask(null);
                }
                setSubmission(false)
            }} key={option.id}/>)}
        </div>
    </div>
  ) 
}

function Option({imageUrl, onSelect}: {
    imageUrl: string;
    onSelect: () => void;
}) {
    return <div>
        <img className="p-2 w-96 rounded-md cursor-pointer" src={imageUrl} onClick={onSelect}/>
    </div>
}

export default NextTask