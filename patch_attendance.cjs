const fs = require('fs');
let code = fs.readFileSync('src/components/ReportingDashboard.tsx', 'utf8');

// Insert after the Temporal Progress Chart or before the CSV Export Desk
const targetAnchor = `      </div>

      {/* CSV Export Desk */}`;

const dataLogicAnchor = `  // 4. Chart Data: Grade Distribution Histogram`;

const dataLogicInsert = `  // 5. Chart Data: Monthly Attendance Trends (Batch vs Overall)
  const attendanceRecords = progressRecords.map(rec => {
    const student = students.find(s => s.id === rec.studentId);
    const dateObj = new Date(rec.evaluationDate);
    const month = dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
    return {
      month,
      batch: student?.batch || 'Unassigned',
      isPresent: rec.attendanceStatus === 'present' ? 1 : 0,
      timestamp: dateObj.getTime()
    };
  });

  const monthlyData = {};
  attendanceRecords.forEach(rec => {
    if (!monthlyData[rec.month]) {
      monthlyData[rec.month] = { total: 0, present: 0, batches: {}, timestamp: rec.timestamp };
    }
    
    monthlyData[rec.month].total += 1;
    monthlyData[rec.month].present += rec.isPresent;
    
    if (!monthlyData[rec.month].batches[rec.batch]) {
      monthlyData[rec.month].batches[rec.batch] = { total: 0, present: 0 };
    }
    
    monthlyData[rec.month].batches[rec.batch].total += 1;
    monthlyData[rec.month].batches[rec.batch].present += rec.isPresent;
  });

  const allBatches = new Set();
  
  const attendanceTrendData = Object.keys(monthlyData)
    .sort((a, b) => monthlyData[a].timestamp - monthlyData[b].timestamp)
    .map(month => {
      const data = monthlyData[month];
      const result = {
        month,
        "Overall Class": Math.round((data.present / data.total) * 100) || 0
      };
      
      Object.keys(data.batches).forEach(batch => {
        allBatches.add(batch);
        const batchData = data.batches[batch];
        result[batch] = Math.round((batchData.present / batchData.total) * 100) || 0;
      });
      
      return result;
    });

  const batchList = Array.from(allBatches);
  const batchColors = ['#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

` + dataLogicAnchor;

const uiInsert = `        {/* Attendance Trends */}
        <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 md:p-8 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Monthly Attendance Trends
              </h3>
              <p className="text-xs text-slate-550 dark:text-gray-400 mt-0.5">
                Comparing individual batch attendance percentages against the overall class average over time
              </p>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrendData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" tickMargin={10} />
                <YAxis domain={[0, 100]} fontSize={11} stroke="#94a3b8" tickFormatter={(val) => \`\${val}%\`} />
                <Tooltip
                  contentStyle={{ background: '#0F0F11', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
                
                {/* Overall Class Performance Line */}
                <Line
                  type="monotone"
                  dataKey="Overall Class"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                
                {/* Individual Batch Lines */}
                {batchList.map((batch, idx) => (
                  <Line
                    key={batch}
                    type="monotone"
                    dataKey={batch}
                    stroke={batchColors[idx % batchColors.length]}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: batchColors[idx % batchColors.length], strokeWidth: 1.5, stroke: '#fff' }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CSV Export Desk */}`;

if (code.includes(dataLogicAnchor) && code.includes(targetAnchor)) {
  code = code.replace(dataLogicAnchor, dataLogicInsert);
  code = code.replace(targetAnchor, uiInsert);
  fs.writeFileSync('src/components/ReportingDashboard.tsx', code);
  console.log("Patched correctly.");
} else {
  console.log("Anchors not found.");
}
