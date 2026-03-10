document.addEventListener("DOMContentLoaded", function () {

// =============================
// Toast Notification System
// =============================

function showToast(message, type='info'){
const container=document.getElementById('toastContainer');
if(!container) return;

const icons={success:'✅',error:'❌',info:'ℹ️'};

const toast=document.createElement('div');
toast.className=`toast toast-${type}`;
toast.innerHTML=`<span class="toast-icon">${icons[type]||'ℹ️'}</span><span>${message}</span>`;
container.appendChild(toast);

setTimeout(()=>{
if(toast.parentNode) toast.parentNode.removeChild(toast);
},3000);
}

// Make toast globally accessible
window.showToast=showToast;

// =============================
// Event Class
// =============================

class Event {
constructor(id,title,category,date,time,location,description,creator,attendees){
this.id=id;
this.title=title;
this.category=category;
this.date=date;
this.time=time;
this.location=location;
this.description=description;
this.creator=creator;
const rawAttendees = Array.isArray(attendees) ? attendees : (attendees ? Object.values(attendees) : [creator]);
this.attendees = rawAttendees.filter(a => a !== "_none");
}
}

// =============================
// Event Manager
// =============================

class EventManager{

constructor(currentUser, currentUserName){

this.events=[];
this.currentEventId=null;
this.currentUser=currentUser;
this.currentUserName=currentUserName;
this.userNamesCache={};
this.isFirstLoad=true;

if(currentUserName){
this.userNamesCache[currentUser]=currentUserName;
}

this.init();

}

init(){
this.setupEventListeners();
this.showLoading();
this.loadEvents();
}

// =============================
// Loading Spinner
// =============================

showLoading(){
const spinner=document.getElementById('loadingSpinner');
const grid=document.getElementById('eventsGrid');
if(spinner) spinner.style.display='flex';
if(grid) grid.style.display='none';
}

hideLoading(){
const spinner=document.getElementById('loadingSpinner');
const grid=document.getElementById('eventsGrid');
if(spinner) spinner.style.display='none';
if(grid) grid.style.display='';
}

// =============================
// Dashboard Stats
// =============================

updateStats(){
const totalEl=document.getElementById('totalEventsCount');
const myEl=document.getElementById('myEventsCount');
const attendingEl=document.getElementById('attendingCount');

const total=this.events.length;
const myEvents=this.events.filter(e=>e.creator===this.currentUser).length;
const attending=this.events.filter(e=>{
const att=Array.isArray(e.attendees)?e.attendees:[];
return att.indexOf(this.currentUser)!==-1;
}).length;

if(totalEl) this.animateNumber(totalEl, parseInt(totalEl.textContent)||0, total);
if(myEl) this.animateNumber(myEl, parseInt(myEl.textContent)||0, myEvents);
if(attendingEl) this.animateNumber(attendingEl, parseInt(attendingEl.textContent)||0, attending);
}

animateNumber(el, from, to){
if(from===to) return;
const duration=400;
const start=performance.now();
const step=(timestamp)=>{
const progress=Math.min((timestamp-start)/duration,1);
const current=Math.round(from + (to-from) * progress);
el.textContent=current;
if(progress<1) requestAnimationFrame(step);
};
requestAnimationFrame(step);
}

// =============================
// Event Listeners
// =============================

setupEventListeners(){

const createBtn=document.getElementById("createEventBtn");
if(createBtn){
createBtn.addEventListener("click",()=>this.openEventModal());
}

const form=document.getElementById("eventForm");
if(form){
form.addEventListener("submit",(e)=>{
e.preventDefault();
this.saveEvent();
});
}

const closeModal=document.getElementById("closeEventModal");
if(closeModal){
closeModal.addEventListener("click",()=>this.closeEventModal());
}

const cancelBtn=document.getElementById("cancelEventBtn");
if(cancelBtn){
cancelBtn.addEventListener("click",()=>this.closeEventModal());
}

const closeDetail=document.getElementById("closeDetailModal");
if(closeDetail){
closeDetail.addEventListener("click",()=>this.closeDetailModal());
}

const closeDetailBtn=document.getElementById("closeDetailBtn");
if(closeDetailBtn){
closeDetailBtn.addEventListener("click",()=>this.closeDetailModal());
}

const searchInput=document.getElementById("searchInput");
if(searchInput){
searchInput.addEventListener("input",()=>this.renderEvents());
}

const categoryFilter=document.getElementById("categoryFilter");
if(categoryFilter){
categoryFilter.addEventListener("change",()=>this.renderEvents());
}

const dateFilter=document.getElementById("dateFilter");
if(dateFilter){
dateFilter.addEventListener("change",()=>this.renderEvents());
}

const rsvpBtn=document.getElementById("rsvpBtn");
if(rsvpBtn){
rsvpBtn.addEventListener("click",()=>this.toggleRSVP());
}

const editBtn=document.getElementById("editEventBtn");
if(editBtn){
editBtn.addEventListener("click",()=>this.editEvent());
}

const deleteBtn=document.getElementById("deleteEventBtn");
if(deleteBtn){
deleteBtn.addEventListener("click",()=>this.deleteEvent());
}

// Clear validation on input
['eventTitle','eventDate','eventTime','eventLocation','eventDescription'].forEach(id=>{
const el=document.getElementById(id);
if(el){
el.addEventListener('input',()=>{
el.classList.remove('invalid');
const errEl=el.parentElement.querySelector('.validation-error');
if(errEl) errEl.classList.remove('show');
});
}
});

}

// =============================
// Load Events from Firebase
// =============================

loadEvents(){

firebase.database().ref("events").on("value",(snapshot)=>{

this.events=[];

snapshot.forEach(child=>{

const data=child.val();

const event=new Event(
child.key,
data.title,
data.category,
data.date,
data.time,
data.location,
data.description,
data.creator,
data.attendees
);

this.events.push(event);

});

if(this.isFirstLoad){
this.isFirstLoad=false;
setTimeout(() => {
    this.hideLoading();
    this.renderEvents();
    this.updateStats();
}, 500); // 500ms min delay
} else {
    this.renderEvents();
    this.updateStats();
}

// Auto-refresh detail modal if open
if(this.currentEventId){
const modal=document.getElementById("detailModal");
if(modal && modal.classList.contains("active")){
const updatedEvent=this.events.find(e=>e.id===this.currentEventId);
if(updatedEvent) this.showEventDetail(updatedEvent);
}
}

});

}

// =============================
// User Name Fetching
// =============================

getUserName(uid){
return new Promise((resolve)=>{
if(this.userNamesCache[uid]){
resolve(this.userNamesCache[uid]);
return;
}

if(uid===this.currentUser){
const authUser=firebase.auth().currentUser;
if(authUser && authUser.displayName){
this.userNamesCache[uid]=authUser.displayName;
resolve(authUser.displayName);
return;
}
}

firebase.database().ref('users/'+uid+'/name').once('value').then((snap)=>{
const name=snap.val();
if(name){
this.userNamesCache[uid]=name;
resolve(name);
}else{
if(uid===this.currentUser){
const authUser=firebase.auth().currentUser;
const fallback=authUser ? (authUser.displayName || authUser.email || 'You') : 'You';
this.userNamesCache[uid]=fallback;
resolve(fallback);
}else{
const shortId='User-'+uid.substring(0,6);
this.userNamesCache[uid]=shortId;
resolve(shortId);
}
}
}).catch(()=>{
if(uid===this.currentUser){
resolve(this.currentUserName || 'You');
}else{
resolve('User-'+uid.substring(0,6));
}
});
});
}

// =============================
// Input Validation
// =============================

validateForm(){
let isValid=true;

// Clear previous errors
document.querySelectorAll('.validation-error').forEach(el=>el.remove());
document.querySelectorAll('.invalid').forEach(el=>el.classList.remove('invalid'));

const title=document.getElementById("eventTitle");
const date=document.getElementById("eventDate");
const time=document.getElementById("eventTime");
const location=document.getElementById("eventLocation");
const description=document.getElementById("eventDescription");

// Title: min 3 chars
if(title.value.trim().length<3){
this.showFieldError(title, "Title must be at least 3 characters");
isValid=false;
}

// Date: not in past
if(date.value){
const today=new Date();
today.setHours(0,0,0,0);
const eventDate=new Date(date.value);
if(eventDate<today){
this.showFieldError(date, "Event date cannot be in the past");
isValid=false;
}
}else{
this.showFieldError(date, "Date is required");
isValid=false;
}

// Time required
if(!time.value){
this.showFieldError(time, "Time is required");
isValid=false;
}

// Location: min 2 chars
if(location.value.trim().length<2){
this.showFieldError(location, "Location must be at least 2 characters");
isValid=false;
}

// Description: min 10 chars
if(description.value.trim().length<10){
this.showFieldError(description, "Description must be at least 10 characters");
isValid=false;
}

return isValid;
}

showFieldError(field, message){
field.classList.add('invalid');
const errorEl=document.createElement('div');
errorEl.className='validation-error show';
errorEl.textContent=message;
field.parentElement.appendChild(errorEl);
}

// =============================
// Event Modal (Create/Edit)
// =============================

openEventModal(event=null){

const modal=document.getElementById("eventModal");
const modalTitle=modal?.querySelector(".modal-header h2");
if(!modal) return;

// Clear previous validation errors
document.querySelectorAll('.validation-error').forEach(el=>el.remove());
document.querySelectorAll('.invalid').forEach(el=>el.classList.remove('invalid'));

if(event){

document.getElementById("eventId").value=event.id;
document.getElementById("eventTitle").value=event.title;
document.getElementById("eventCategory").value=event.category;
document.getElementById("eventDate").value=event.date;
document.getElementById("eventTime").value=event.time;
document.getElementById("eventLocation").value=event.location;
document.getElementById("eventDescription").value=event.description;
if(modalTitle) modalTitle.textContent="Edit Event";

}else{

document.getElementById("eventForm").reset();
document.getElementById("eventId").value="";
if(modalTitle) modalTitle.textContent="Create Event";

}

modal.classList.add("active");

}

closeEventModal(){

const modal=document.getElementById("eventModal");

if(modal){
modal.classList.remove("active");
}

}

// =============================
// Save Event (Create or Update)
// =============================

saveEvent(){

// Validate first
if(!this.validateForm()) return;

const eventId=document.getElementById("eventId").value;
const title=document.getElementById("eventTitle").value.trim();
const category=document.getElementById("eventCategory").value;
const date=document.getElementById("eventDate").value;
const time=document.getElementById("eventTime").value;
const location=document.getElementById("eventLocation").value.trim();
const description=document.getElementById("eventDescription").value.trim();

if(eventId){

const existingEvent=this.events.find(e=>e.id===eventId);

const updateData={
title:title,
category:category,
date:date,
time:time,
location:location,
description:description
};

if(existingEvent){
updateData.creator=existingEvent.creator;
updateData.attendees=existingEvent.attendees;
}

firebase.database().ref("events/"+eventId).update(updateData)
.then(()=>{
showToast("Event updated successfully!","success");
document.getElementById("eventForm").reset();
this.closeEventModal();
})
.catch((error)=>{
console.error("Error updating event:",error);
showToast("Error updating event","error");
});

}else{

const eventData={
title:title,
category:category,
date:date,
time:time,
location:location,
description:description,
creator:this.currentUser,
attendees:[this.currentUser]
};

firebase.database().ref("events").push(eventData)
.then(()=>{
showToast("Event created successfully! 🎉","success");
document.getElementById("eventForm").reset();
this.closeEventModal();
})
.catch((error)=>{
console.error("Error creating event:",error);
showToast("Error creating event","error");
});

}

}

// =============================
// Edit / Delete
// =============================

editEvent(){

const event=this.events.find(e=>e.id===this.currentEventId);
if(!event) return;

if(event.creator!==this.currentUser){
showToast("Only the event creator can edit this event","error");
return;
}

this.closeDetailModal();
this.openEventModal(event);

}

deleteEvent(){

const event=this.events.find(e=>e.id===this.currentEventId);
if(!event) return;

if(event.creator!==this.currentUser){
showToast("Only the event creator can delete this event","error");
return;
}

if(confirm("Are you sure you want to delete this event?")){

firebase.database().ref("events/"+event.id).remove()
.then(()=>{
showToast("Event deleted successfully","success");
this.currentEventId=null;
this.closeDetailModal();
})
.catch((error)=>{
console.error("Error deleting event:",error);
showToast("Error deleting event","error");
});

}

}

// =============================
// RSVP Toggle
// =============================

toggleRSVP(){

const event=this.events.find(e=>e.id===this.currentEventId);
if(!event) return;

let attendees=Array.isArray(event.attendees) ? [...event.attendees] : [];

const isAttending=attendees.indexOf(this.currentUser) !== -1;

if(isAttending){
attendees=attendees.filter(a=>a!==this.currentUser);
}else{
attendees.push(this.currentUser);
}

const newAttendees = attendees.length > 0 ? attendees : ["_none"];

firebase.database().ref("events/"+event.id).update({
attendees: newAttendees
}).then(()=>{
if(isAttending){
showToast("RSVP cancelled","info");
}else{
showToast("You joined the event! 🎉","success");
}
}).catch((error)=>{
console.error("RSVP update failed:",error);
showToast("Failed to update RSVP","error");
});

}

// =============================
// Event Detail Modal
// =============================

async showEventDetail(event){

this.currentEventId=event.id;

const modal=document.getElementById("detailModal");
const content=document.getElementById("eventDetailContent");
const rsvpBtn=document.getElementById("rsvpBtn");
const editBtn=document.getElementById("editEventBtn");
const deleteBtn=document.getElementById("deleteEventBtn");

if(!modal) return;

const attendees=Array.isArray(event.attendees) ? event.attendees : [];
const isAttending=attendees.indexOf(this.currentUser) !== -1;
const isCreator=event.creator===this.currentUser;

const categoryLabels={
social:"🎉 Social",
professional:"💼 Professional",
sports:"⚽ Sports",
arts:"🎨 Arts & Culture",
education:"📚 Education",
technology:"💻 Technology",
music:"🎵 Music",
food:"🍕 Food & Drinks",
health:"🧘 Health & Wellness",
travel:"✈️ Travel",
charity:"🤝 Charity",
other:"🌟 Other"
};

let attendeeNames=[];
if(attendees.length>0){
const namePromises=attendees.map(uid=>this.getUserName(uid));
attendeeNames=await Promise.all(namePromises);
}

const attendeeListHTML=attendeeNames.length>0
? attendeeNames.map(name=>`<span style="display:inline-block;background:rgba(99,102,241,0.15);color:#818cf8;padding:4px 10px;border-radius:20px;font-size:13px;margin:3px;">${name}</span>`).join("")
: "<span style='color:#94a3b8;'>No attendees yet</span>";

content.innerHTML=`
<h2>${event.title}</h2>
<p><b>Category:</b> ${categoryLabels[event.category] || event.category}</p>
<p><b>Date:</b> ${event.date} at ${event.time}</p>
<p><b>Location:</b> ${event.location}</p>
<p style="margin:10px 0;">${event.description}</p>
<p><b>Attendees (${attendees.length}):</b></p>
<div style="margin-top:6px;">${attendeeListHTML}</div>
`;

rsvpBtn.textContent=isAttending ? "Cancel RSVP" : "Join Event";
rsvpBtn.style.display="inline-block";

if(editBtn) editBtn.style.display=isCreator?"inline-block":"none";
if(deleteBtn) deleteBtn.style.display=isCreator?"inline-block":"none";

modal.classList.add("active");

}

closeDetailModal(){

const modal=document.getElementById("detailModal");

if(modal){
modal.classList.remove("active");
}

}

// =============================
// Filters
// =============================

getFilteredEvents(){

const search=document.getElementById("searchInput")?.value.toLowerCase() || "";
const category=document.getElementById("categoryFilter")?.value || "all";
const dateFilter=document.getElementById("dateFilter")?.value || "all";

let filtered=this.events;

if(search){
filtered=filtered.filter(event =>
event.title.toLowerCase().includes(search) ||
event.description.toLowerCase().includes(search) ||
event.location.toLowerCase().includes(search)
);
}

if(category!=="all"){
filtered=filtered.filter(event => event.category===category);
}

if(dateFilter!=="all"){

const now=new Date();
now.setHours(0,0,0,0);

filtered=filtered.filter(event =>{

const eventDate=new Date(event.date);
eventDate.setHours(0,0,0,0);

if(dateFilter==="upcoming"){
return eventDate>=now;
}

if(dateFilter==="thisWeek"){
const weekLater=new Date(now);
weekLater.setDate(weekLater.getDate()+7);
return eventDate>=now && eventDate<=weekLater;
}

if(dateFilter==="thisMonth"){
return eventDate.getMonth()===now.getMonth() && eventDate.getFullYear()===now.getFullYear() && eventDate>=now;
}

return true;
});
}

return filtered;

}

// =============================
// Render Events with Staggered Animation
// =============================

renderEvents(){

const grid=document.getElementById("eventsGrid");

if(!grid) return;

const filtered=this.getFilteredEvents();

const categoryEmojis={
social:"🎉",
professional:"💼",
sports:"⚽",
arts:"🎨",
education:"📚",
technology:"💻",
music:"🎵",
food:"🍕",
health:"🧘",
travel:"✈️",
charity:"🤝",
other:"🌟"
};

if(filtered.length===0){

grid.innerHTML=`<p style="text-align:center;width:100%;color:var(--text-muted);padding:40px 0;">No events found</p>`;

return;

}

grid.innerHTML=filtered.map((event,index)=>{

const attendees=Array.isArray(event.attendees)?event.attendees:[];

return `
<div class="event-card" style="animation-delay:${index*0.08}s" onclick="window.app.showEventDetail(window.app.events.find(e=>e.id==='${event.id}'))">

<span style="font-size:12px;background:rgba(99,102,241,0.2);padding:4px 10px;border-radius:20px;color:#818cf8;">${categoryEmojis[event.category]||"📌"} ${event.category}</span>
<h3 style="margin-top:10px;">${event.title}</h3>
<p>📅 ${event.date} ${event.time}</p>
<p>📍 ${event.location}</p>
<p>${event.description}</p>
<p>👥 ${attendees.length} attending</p>

</div>
`;
}).join("");

}

}

// =============================
// Initialize after Firebase Auth
// =============================

firebase.auth().onAuthStateChanged(function(user) {
if (user) {
const displayName = user.displayName || user.email || 'User';
window.app = new EventManager(user.uid, displayName);
}
});

});