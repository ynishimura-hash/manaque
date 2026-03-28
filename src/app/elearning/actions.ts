"use server";

import { createClient } from "@/utils/supabase/server";

const MANAQUE_CURRICULUM_ID = "cc000001-0000-4000-8000-000000000001";

export interface LessonRow {
    id: string;
    title: string;
    youtube_url: string | null;
    duration: string | null;
    type: string;
    order_index: number;
    thumbnail_url: string | null;
    has_quiz: boolean;
    quiz: QuizQuestion[] | null;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
}

export interface ProgressRow {
    lesson_id: string;
    status: string;
    progress_percent: number;
    quiz_score: number | null;
    completed_at: string | null;
}

export async function fetchLessonsAction(): Promise<LessonRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("course_lessons")
        .select("id, title, youtube_url, duration, type, order_index, thumbnail_url, has_quiz, quiz")
        .eq("curriculum_id", MANAQUE_CURRICULUM_ID)
        .is("deleted_at", null)
        .order("order_index");

    if (error) {
        return [];
    }
    return (data ?? []) as LessonRow[];
}

export async function fetchProgressAction(userId: string): Promise<ProgressRow[]> {
    if (!userId) return [];
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("course_progress")
        .select("lesson_id, status, progress_percent, quiz_score, completed_at")
        .eq("user_id", userId);

    if (error) {
        return [];
    }
    return (data ?? []) as ProgressRow[];
}

export async function upsertProgressAction(
    userId: string,
    lessonId: string,
    courseId: string,
    updates: {
        status?: string;
        progress_percent?: number;
        quiz_score?: number;
        completed_at?: string;
    }
): Promise<void> {
    if (!userId) return;
    const supabase = await createClient();

    const { data: existing } = await supabase
        .from("course_progress")
        .select("id")
        .eq("user_id", userId)
        .eq("lesson_id", lessonId)
        .single();

    if (existing) {
        await supabase
            .from("course_progress")
            .update({ ...updates, last_accessed_at: new Date().toISOString() })
            .eq("id", existing.id);
    } else {
        await supabase.from("course_progress").insert({
            user_id: userId,
            lesson_id: lessonId,
            course_id: courseId,
            status: updates.status ?? "in_progress",
            progress_percent: updates.progress_percent ?? 0,
            quiz_score: updates.quiz_score ?? null,
            completed_at: updates.completed_at ?? null,
            last_accessed_at: new Date().toISOString(),
        });
    }
}
