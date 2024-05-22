"use client"
import { useState } from "react";
import UploadImage from './UploadImage'
import { useRouter } from "next/router";
import axios from "axios";
import { BACKEND_URL } from "@/utils";

function Upload() {
    const [images, setImages] = useState<string[]>([]);
    const [title, setTitle] = useState("");
  return (
    <div>
        <div className="flex justify-center text-blue-500 font-thin">
            <div className="max-w-screen-lg w-full">
                <div className="pl-4 text-2xl pt-10 w-full">
                    Create Task
                </div>
                <label className="pl-4 block mt-2 text-md text-gray-500">
                    Task Details
                </label>
                <input className="ml-4 mt-1 border border-blue-700 bg-gray-900 text-blue-300 text-sm rounded-lg
                                  w-full p-1.5" type='text' placeholder="what's your task?" 
                                  onChange={(e) => {
                                    setTitle(e.target.value);
                                    }}/>
                <label className="pl-4 block mt-5">
                    Add Images
                </label>
                <div className="mt-4 w-28 h-42 flex justify-around">
                    {images.map(image => <UploadImage image={image} onImageAdded={(imageUrl) => {
                        setImages(i => [...i, imageUrl]);
                        }} />)}
                </div>
            </div>
        </div>
        <UploadImage onImageAdded={(imageUrl) => {
            setImages(i => [...i, imageUrl]);
            }} />
    </div>
  )
}

export default Upload