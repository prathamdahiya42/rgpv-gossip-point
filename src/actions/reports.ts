'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';
import type { ServerActionResponse, ReportTargetType } from '@/types';

export async function reportContent(
  targetType: ReportTargetType,
  targetId: string,
  reason: string
): Promise<ServerActionResponse> {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();

    // Check if user already reported this target
    const { data: existing } = await supabase
      .from('reports')
      .select('id')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('reporter_id', profile.id)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'You have already reported this item' };
    }

    // Insert report (the database trigger will automatically increment report_count and auto-hide if needed)
    const { error: reportError } = await supabase
      .from('reports')
      .insert({
        target_type: targetType,
        target_id: targetId,
        reporter_id: profile.id,
        reason: reason.trim(),
      });

    if (reportError) throw reportError;

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit report';
    return { success: false, error: message };
  }
}
