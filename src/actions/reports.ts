'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/session';
import type { ServerActionResponse } from '@/types';

export async function reportContent(
  targetType: 'post' | 'comment',
  targetId: string,
  reason: string
): Promise<ServerActionResponse> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Check if user already reported this content
    const { data: existing } = await supabase
      .from('reports')
      .select('id')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('reporter_id', user.id)
      .single();

    if (existing) {
      return { success: false, error: 'You already reported this content' };
    }

    // Insert report
    const { error: reportError } = await supabase
      .from('reports')
      .insert({
        target_type: targetType,
        target_id: targetId,
        reporter_id: user.id,
        reason: reason.trim(),
      });

    if (reportError) throw reportError;

    // Increment report count — this triggers auto-hide at 3
    const { error: rpcError } = await supabase
      .rpc('increment_report_count', {
        p_target_type: targetType,
        p_target_id: targetId,
      });

    if (rpcError) throw rpcError;

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to report content';
    return { success: false, error: message };
  }
}

export async function resolveReport(
  reportId: string,
  action: 'keep' | 'remove'
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    // Get the report
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) throw new Error('Report not found');

    // Mark report as resolved
    const { error: resolveError } = await supabase
      .from('reports')
      .update({ resolved: true })
      .eq('id', reportId);

    if (resolveError) throw resolveError;

    // If removing, update the content status
    if (action === 'remove') {
      const table = report.target_type === 'post' ? 'posts' : 'comments';
      const { error: statusError } = await supabase
        .from(table)
        .update({ status: 'removed' })
        .eq('id', report.target_id);

      if (statusError) throw statusError;
    } else {
      // If keeping, restore to visible
      const table = report.target_type === 'post' ? 'posts' : 'comments';
      const { error: statusError } = await supabase
        .from(table)
        .update({ status: 'visible', report_count: 0 })
        .eq('id', report.target_id);

      if (statusError) throw statusError;
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to resolve report';
    return { success: false, error: message };
  }
}
