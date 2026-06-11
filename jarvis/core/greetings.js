// Wake greetings — varies every time, always sounds like Jarvis.
// Time-of-day aware, occasionally references live state passed in.
const OPENERS = {
  morning: [
    'Good morning, Faris. Systems are up.',
    'Morning, Faris. Everything held together overnight.',
    'Good morning. The day is yours when you are.',
    'Morning. Coffee first or straight to it?',
  ],
  afternoon: [
    'Good afternoon, Faris. Picking up where we left off.',
    'Afternoon. All systems steady.',
    'Good afternoon. Ready when you are.',
  ],
  evening: [
    'Good evening, Faris. Still at it, I see.',
    'Evening. Systems online, lights down low.',
    'Good evening. Let\'s make it count.',
  ],
  late: [
    'Burning the midnight oil again, Faris. Systems online.',
    'It\'s late. I\'m awake if you are.',
    'The quiet hours. Best work happens now. Online and ready.',
  ],
}

function partOfDay(h = new Date().getHours()) {
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 23) return 'evening'
  return 'late'
}

// extras: { awaitingFaris, unread, tasks } — appended sparingly, one max
function greeting(extras = {}) {
  const pool = OPENERS[partOfDay()]
  let line = pool[Math.floor(Math.random() * pool.length)]
  const tails = []
  if (extras.awaitingFaris > 0) {
    tails.push(`${extras.awaitingFaris === 1 ? 'One build is' : extras.awaitingFaris + ' builds are'} waiting on your design call.`)
  }
  if (extras.clientForms > 0) {
    tails.push(`There ${extras.clientForms === 1 ? 'is a new client form' : 'are new client forms'} in the inbox.`)
  }
  if (tails.length === 0 && extras.tasks > 0 && Math.random() < 0.4) {
    tails.push(`${extras.tasks} open ${extras.tasks === 1 ? 'task' : 'tasks'} on the board.`)
  }
  if (tails.length) line += ' ' + tails[0]
  return line
}

module.exports = { greeting, partOfDay }
