const mongoose = require('mongoose')
const { server } = require('../index')
const Note = require('../models/Note')
const { initialNotes, api, getAllNotes } = require('./helpers/notes-helpers')

beforeEach(async () => {
  await Note.deleteMany({})

  const noteObjects = initialNotes.map((note) => new Note(note))
  const promiseArray = noteObjects.map((note) => note.save())
  await Promise.all(promiseArray)
})

test('should return notes in type json', async () => {
  await api
    .get('/api/notes')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('should return notes', async () => {
  const { response } = await getAllNotes()

  expect(response.body).toHaveLength(initialNotes.length)
})

test('should return notes contains a note about html ', async () => {
  const { contents } = await getAllNotes()

  expect(contents).toContain('HTML is easy test')
})

test('should add a new note', async () => {
  const newNote = {
    content: 'Test new note :D',
    important: false,
  }

  await api
    .post('/api/notes')
    .send(newNote)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const { contents, response } = await getAllNotes()

  expect(contents).toContain(newNote.content)

  expect(response.body).toHaveLength(initialNotes.length + 1)
})

test('note with without content', async () => {
  const newNote = {
    important: false,
  }

  await api
    .post('/api/notes')
    .send(newNote)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const { response } = await getAllNotes()
  expect(response.body).toHaveLength(initialNotes.length)
})

test('note with without small content', async () => {
  const newNote = {
    content: '',
  }

  await api
    .post('/api/notes')
    .send(newNote)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const { response } = await getAllNotes()
  expect(response.body).toHaveLength(initialNotes.length)
})

test('should delete the first note', async () => {
  const { response: firstResponse } = await getAllNotes()
  const [noteToDelete] = firstResponse.body
  const { id } = noteToDelete
  await api.delete(`/api/notes/${id}`).expect(204)

  const { response: newResponse, contents } = await getAllNotes()
  expect(contents).not.toContain(noteToDelete.content)

  expect(newResponse.body).toHaveLength(initialNotes.length - 1)
})

test('Delete with invalid ID ', async () => {
  await api
    .delete(`/api/notes/invalidID`)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const { response } = await getAllNotes()

  expect(response.body).toHaveLength(initialNotes.length)
})

test('should return a note with new info', async () => {
  const noteWithNewContent = {
    content: 'This is a new content',
  }
  const { response: firstResponse } = await getAllNotes()
  const [noteToUpdate] = firstResponse.body
  const { id } = noteToUpdate

  await api
    .put(`/api/notes/${id}`)
    .send(noteWithNewContent)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const { response: newResponse, contents } = await getAllNotes()

  expect(contents).toContain(noteWithNewContent.content)

  expect(newResponse.body).toHaveLength(initialNotes.length)
})

test('Edit with invalid ID', async () => {
  const noteWithNewContent = {
    content: 'this note has a wrong id',
  }

  await api
    .put(`/api/notes/wrongId`)
    .send(noteWithNewContent)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const { response } = await getAllNotes()

  expect(response.body).toHaveLength(initialNotes.length)
})

test('Edit the second note without content', async () => {
  const { response: firstResponse } = await getAllNotes()
  const [noteToUpdate] = firstResponse.body
  const { id } = noteToUpdate

  await api
    .put(`/api/notes/${id}`)
    .send()
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const { response } = await getAllNotes()

  expect(response.body).toHaveLength(initialNotes.length)
})

afterAll(() => {
  server.close()
  mongoose.connection.close()
})
