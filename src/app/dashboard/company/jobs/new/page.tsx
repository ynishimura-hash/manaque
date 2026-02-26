"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/appStore';
import { toast } from 'sonner';
import { Job } from '@/types/shared';
import JobForm from '@/components/dashboard/JobForm';
import { createJobAction } from '@/app/admin/actions';

export default function JobNewPage() {
    const router = useRouter();
    const { fetchJobs, currentCompanyId } = useAppStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: Partial<Job>) => {
        if (!currentCompanyId) {
            toast.error('ログイン情報が不明です。再ログインをお試しください。');
            return;
        }

        setIsSubmitting(true);
        try {
            const jobPayload = {
                ...data,
                companyId: currentCompanyId,
                is_public: true,
                hiring_status: 'open'
            };

            const result = await createJobAction(jobPayload);

            if (result.success) {
                toast.success('求人を公開しました');
                // Refresh list to include new job
                await fetchJobs();
                router.push('/dashboard/company/jobs');
            } else {
                console.error('Save failed:', result.error);
                toast.error(`保存に失敗しました: ${result.error}`);
            }
        } catch (e: any) {
            console.error('Submit error:', e);
            toast.error(`エラーが発生しました: ${e.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return <JobForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitLabel="公開する" />;
}
