document.addEventListener('DOMContentLoaded', (event) => {
    // กำหนดวันที่เริ่มต้นและสิ้นสุดของช่วง 2 เดือน
    let currentDate = new Date(); // เริ่มต้นจากเดือนปัจจุบัน

    // ฟังก์ชันสำหรับสร้างข้อมูลช่างจำลอง (Mock Data)
    function generateTechnicianData(startDate, endDate) {
        const data = [];
        let cursorDate = new Date(startDate);

        while (cursorDate <= endDate) {
            const dateString = cursorDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const dayOfWeek = cursorDate.getDay(); // 0 = อาทิตย์, 6 = เสาร์

            let technicianA_available = Math.floor(Math.random() * 5); // 0-4 คน
            let technicianB_available = Math.floor(Math.random() * 5); // 0-4 คน

            // ทำให้บางวันมีเงื่อนไขสีต่างๆ เพื่อทดสอบ
            if (Math.random() < 0.1) { // 10% โอกาสที่จะไม่มีช่างเลย
                technicianA_available = 0;
                technicianB_available = 0;
            } else if (Math.random() < 0.2) { // 20% โอกาสที่จะมีช่าง A/B มากกว่า 1 คน
                 if (technicianA_available <= 1) technicianA_available = Math.floor(Math.random() * 3) + 2; // อย่างน้อย 2 คน
                 if (technicianB_available <= 1) technicianB_available = Math.floor(Math.random() * 3) + 2; // อย่างน้อย 2 คน
            }

            data.push({
                id: dateString, // ใช้ dateString เป็น ID ของ task
                text: dateString, // DHTMLX ต้องการ text ใน task เพื่อแสดงใน Grid
                start_date: dateString,
                duration: 1, // แต่ละ task คือ 1 วัน
                technicianA: technicianA_available,
                technicianB: technicianB_available
            });

            cursorDate.setDate(cursorDate.getDate() + 1); // เลื่อนไปวันถัดไป
        }
        return data;
    }

    // ฟังก์ชันสำหรับตั้งค่าและแสดงผล Gantt Chart
    function renderGantt(monthOffset = 0) {
        // คำนวณช่วงวันที่สำหรับ 2 เดือน
        const firstDayOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
        const lastDayOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset + 2, 0); // สิ้นสุดของเดือนที่สอง

        // แสดงช่วงเดือนที่กำลังดู
        document.getElementById('currentMonthRange').innerText =
            `${firstDayOfPeriod.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })} - ` +
            `${lastDayOfPeriod.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`;

        // กำหนดการตั้งค่า Gantt Chart
        gantt.config.scale_unit = "day";
        gantt.config.date_scale = "%D, %d %M"; // แสดง วันในสัปดาห์, วันที่ เดือน
        gantt.config.subscales = [
            { unit: "month", step: 1, date: "%F, %Y" }
        ];

        // กำหนดคอลัมน์ในส่วน Grid (ตารางด้านซ้าย)
        gantt.config.columns = [
            // คอลัมน์สำหรับแสดงวันที่ใน Grid
            { name: "date_display", label: "วันที่", width: 90, resize: true, template: function(item) {
                return new Date(item.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'numeric' });
            }},
            // คอลัมน์สำหรับแสดงข้อมูลช่างว่าง
            {
                name: "technicianInfo", label: "ช่างว่าง (A/B)", width: 120, align: "center", template: function(item) {
                    return `A: ${item.technicianA} / B: ${item.technicianB}`;
                }
            }
        ];

        gantt.config.row_height = 30; // ความสูงของแต่ละแถว
        // gantt.config.task_height จะถูกจัดการโดย CSS เพื่อซ่อน task bar
        gantt.config.show_errors = false;

        // **สำคัญ:** กำหนด template สำหรับสีพื้นหลังของแต่ละแถวในส่วน Timeline
        // เราจะใช้ task_row_class เพื่อกำหนด class ให้กับทั้งแถวของแต่ละวัน
        gantt.templates.task_row_class = function(start, end, task) {
            const itemDate = new Date(task.start_date);
            const dayOfWeek = itemDate.getDay(); // 0 = อาทิตย์, 6 = เสาร์

            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const technicianA = task.technicianA;
            const technicianB = task.technicianB;

            if (isWeekend) {
                return 'gantt_cell_yellow'; // วันเสาร์-อาทิตย์
            } else if (technicianA > 1 && technicianB > 1) {
                return 'gantt_cell_green'; // ช่าง A และ B ว่างเกิน 1 คน
            } else if (technicianA === 0 && technicianB === 0) {
                return 'gantt_cell_gray'; // ช่าง A และ B ไม่ว่างเลย
            }
            return ''; // ไม่มีเงื่อนไขใดๆ ตรง
        };

        // ตั้งค่าวันที่เริ่มต้นและสิ้นสุดของแผนภูมิ
        gantt.config.start_date = firstDayOfPeriod;
        gantt.config.end_date = new Date(lastDayOfPeriod.getFullYear(), lastDayOfPeriod.getMonth(), lastDayOfPeriod.getDate() + 1); // DHTMLX ต้องการ end date ถัดจากวันสุดท้าย 1 วัน

        // **สำคัญ:** ปรับแต่ง Layout เพื่อให้ส่วน Grid และ Timeline แสดงผลอย่างชัดเจน
        // และซ่อน Task Bar โดยใช้ CSS
        gantt.config.layout = {
            css: "gantt_container",
            rows: [
                {
                    cols: [
                        {
                            view: "grid",
                            id: "grid",
                            scrollX: "gridScroll",
                            scrollY: "scroll",
                            width: gantt.config.grid_width // ใช้ความกว้าง Grid default หรือกำหนดเอง
                        },
                        { resizer: true, width: 1 }, // ตัวแบ่ง
                        {
                            view: "timeline",
                            id: "timeline",
                            scrollX: "timelineScroll",
                            scrollY: "scroll"
                        },
                        { view: "scrollbar", id: "scroll" }
                    ]
                },
                { view: "scrollbar", id: "gridScroll", group: "horizontal" },
                { view: "scrollbar", id: "timelineScroll", group: "horizontal" }
            ]
        };

        // เริ่มต้นและโหลดข้อมูล
        gantt.clearAll(); // เคลียร์ข้อมูลเก่า
        gantt.init("gantt_here");

        const tasks = { data: generateTechnicianData(firstDayOfPeriod, lastDayOfPeriod) };
        gantt.parse(tasks);
    }

    // เรียกใช้ครั้งแรกเมื่อโหลดหน้า
    renderGantt();

    // Event Listeners สำหรับปุ่มนำทาง
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 2); // ย้อนกลับ 2 เดือน
        renderGantt();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 2); // เลื่อนไป 2 เดือน
        renderGantt();
    });
});
