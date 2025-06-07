'use client'
import Usercard from '@/components/UserInterface/Usercard';
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ClassSection from '@/components/UserInterface/ClassSection';

export default function DashboardPage() {

  return (
    <div>
      <Usercard/>
       <ClassSection/>
    </div>
  );
}
