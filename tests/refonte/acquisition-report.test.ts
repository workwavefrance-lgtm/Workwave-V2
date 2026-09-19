import test from 'node:test';
import assert from 'node:assert/strict';
import { acquisitionReport } from '../../lib/analytics/acquisition-report';
const at = Date.parse('2026-09-19T10:00:00Z');
const acquisition = { version: 1, sessionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', entryPath: '/peintre/draveil', startedAt: at-1000 };
const ev = (event_name: string, project_id: number|null=null, context: unknown=acquisition) => ({ event_name, project_id, created_at: new Date(at).toISOString(), metadata: { acquisition: context } });
test('same session and same project are deduplicated; only existing valid projects count',()=>{
  const report=acquisitionReport([ev('page_view'),ev('page_view'),ev('project_cta_clicked'),ev('project_cta_clicked'),ev('project_form_started'),ev('project_form_submitted',1),ev('project_form_submitted',1),ev('project_form_submitted',99),ev('project_form_submitted',2,null)], [1,2]);
  assert.deepEqual(report,{pages:[{path:'/peintre/draveil',family:'autre-page-publique',sessions:1,ctaSessions:1,startedSessions:1,projects:1}],attributedProjects:1,unattributedProjects:1});
});
test('expired, private, malformed and historic untracked data stay unattributed',()=>{
  const report=acquisitionReport([ev('project_form_submitted',1,{...acquisition,entryPath:'/avis/private-token'}),ev('project_form_submitted',2,{...acquisition,startedAt:at-3600000}),{...ev('project_form_submitted',3),metadata:null}], [1,2,3]);
  assert.deepEqual(report,{pages:[],attributedProjects:0,unattributedProjects:3});
});
