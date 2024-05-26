"use client"
import Appbar from '@/components/Appbar'
import { BACKEND_URL } from '@/utils'
import axios from 'axios'
import { useEffect, useState } from 'react'

async function getTaskDetails(taskId: Number) {
    const response = await axios.get(`${BACKEND_URL}/v1/user/task?taskId=${taskId}`, {
        headers: {
            "Authorization": localStorage.getItem("token")
        }
    })
    return response.data
}

function page({params: { 
    taskId 
}}: {params: { taskId: string }}) {

    const [result, setResult] = useState<Record<string, {
        count: number;
        option: {
            imageUrl: string
        }
    }>>({});

    const [taskDetails, setTaskDetails] = useState<{
        title?: string
    }>({});

    useEffect(() => {
        getTaskDetails(Number(taskId))
            .then((data) => {
                setResult(data.result)
                setTaskDetails(data.taskDetails)
            })
    }, [taskId]);

  return (
    <div>
        <Appbar />
        task page
    </div>
  )
}

export default page