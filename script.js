// Simple in-browser booking demo
const services = [
  {id:1, name:'Tuns + Finisaj', duration:45, price:6000},
  {id:2, name:'Tuns simplu', duration:30, price:4000},
  {id:3, name:'Barbierit', duration:25, price:3500}
];
const specialists = [
  {id:1, name:'Andrei', phone:'+40721234567', open:9, close:18},
  {id:2, name:'Mihai', phone:'+40729876543', open:10, close:17}
];
// in-memory bookings for demo (not persisted)
let bookings = []; // {specialistId, dateISO, startHourDecimal, duration}
let selectedService = null, selectedSpecialist = null, selectedDate = null, selectedTime = null;

function $(id){return document.getElementById(id)}
function renderServices(){
  const container = $('services'); container.innerHTML='';
  services.forEach(s=>{
    const el = document.createElement('div'); el.className='card'; el.textContent=`${s.name} — ${s.duration} min`;
    el.onclick=()=>{ document.querySelectorAll('#services .card').forEach(c=>c.classList.remove('selected')); el.classList.add('selected'); selectedService=s; renderTimes(); enableConfirmIfReady();}
    container.appendChild(el);
  });
}
function renderSpecialists(){
  const container = $('specialists'); container.innerHTML='';
  specialists.forEach(sp=>{
    const el = document.createElement('div'); el.className='card'; el.textContent=`${sp.name} (${sp.open}:00–${sp.close}:00)`;
    el.onclick=()=>{ document.querySelectorAll('#specialists .card').forEach(c=>c.classList.remove('selected')); el.classList.add('selected'); selectedSpecialist=sp; renderTimes(); enableConfirmIfReady();}
    container.appendChild(el);
  });
}
function buildCalendar(){
  const cal = $('calendar'); cal.innerHTML='';
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0..6 (Sun..Sat)
  // show days 1..n
  const daysInMonth = new Date(year, month+1, 0).getDate();
  for(let i=0;i<startDay;i++){ const placeholder = document.createElement('div'); placeholder.className='day'; placeholder.style.visibility='hidden'; cal.appendChild(placeholder); }
  for(let d=1; d<=daysInMonth; d++){
    const dt = new Date(year, month, d);
    const el = document.createElement('div'); el.className='day card'; el.textContent=d;
    if(dt < new Date(now.getFullYear(), now.getMonth(), now.getDate())) el.classList.add('past');
    if(d==now.getDate()) el.classList.add('today');
    el.onclick = ()=>{ if(el.classList.contains('past')) return; document.querySelectorAll('#calendar .day').forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); selectedDate = dt.toISOString().slice(0,10); renderTimes(); enableConfirmIfReady();}
    cal.appendChild(el);
  }
}
function toDecimalHour(hm){ return hm; } // placeholder
function renderTimes(){
  const container = $('times'); container.innerHTML='';
  if(!selectedService || !selectedSpecialist || !selectedDate) return;
  const s = selectedService.duration;
  const sp = selectedSpecialist;
  const dayBookings = bookings.filter(b=>b.specialistId==sp.id && b.dateISO==selectedDate);
  // create slots between open..close in 15-min steps, only keep slots where s fits without overlap
  const step = 15;
  for(let hr = sp.open; hr < sp.close; hr += 0.25){
    const start = hr;
    const startMinutes = Math.round((start - Math.floor(start)) * 60);
    const startHour = Math.floor(start);
    const dateStart = new Date(`${selectedDate}T${String(startHour).padStart(2,'0')}:${String(startMinutes).padStart(2,'0')}:00`);
    const endDate = new Date(dateStart.getTime() + s*60000);
    if(endDate.getHours() > sp.close || (endDate.getHours()==sp.close && endDate.getMinutes()>0)) continue;
    // check overlap
    const overlaps = dayBookings.some(b=>{
      const bStart = new Date(`${b.dateISO}T${b.time}`);
      const bEnd = new Date(bStart.getTime() + b.duration*60000);
      return !(endDate <= bStart || dateStart >= bEnd);
    });
    if(overlaps) continue;
    const btn = document.createElement('div'); btn.className='card'; btn.textContent = dateStart.toTimeString().slice(0,5);
    btn.onclick = ()=>{ document.querySelectorAll('#times .card').forEach(c=>c.classList.remove('selected')); btn.classList.add('selected'); selectedTime = dateStart.toTimeString().slice(0,5); enableConfirmIfReady(); }
    container.appendChild(btn);
  }
}

function isValidPhone(p){
  if(!p) return false;
  // allow + and digits, min 6 digits
  const digits = p.replace(/[^0-9]/g,'');
  return digits.length>=6;
}

function enableConfirmIfReady(){
  const btn = $('btnConfirm');
  btn.disabled = !(selectedService && selectedSpecialist && selectedDate && selectedTime && isValidPhone($('phone').value));
}

function confirmBooking(){
  const phone = $('phone').value.trim();
  const name = $('name').value.trim() || 'Client';
  if(!isValidPhone(phone)){ $('status').textContent='Număr telefon invalid'; return; }
  // prepare whatsapp message (encode)
  const text = `Rezervare BarberSalon%0AClient: ${name}%0ATelefon: ${phone}%0AServiciu: ${selectedService.name}%0ASpecialist: ${selectedSpecialist.name}%0AData: ${selectedDate}%0AOra: ${selectedTime}`;
  const wa = `https://wa.me/?text=${text}`;
  // for demo, also add to in-memory bookings
  bookings.push({specialistId:selectedSpecialist.id, dateISO:selectedDate, time:selectedTime, duration:selectedService.duration});
  window.open(wa, '_blank');
}

window.addEventListener('load', ()=>{
  renderServices(); renderSpecialists(); buildCalendar();
  $('btnConfirm').addEventListener('click', confirmBooking);
  $('phone').addEventListener('input', enableConfirmIfReady);
});
