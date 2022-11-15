import express from 'express';
const app = express();
const PORT = 8000;

const todayDate = new Date();

app.get('/', (request, response) => {});

app.get('/get_static_data/:hh-:mm-:ss', async (request, response) => {
  const inputDate = new Date(`${todayDate.getFullYear()}-` +
                              `${todayDate.getMonth()}-` +
                              `${todayDate.getDate()}T` +
                              `${request.params.hh}:` +
                              `${request.params.mm}:` +
                              `${request.params.ss}.000+02:00`);
  if (!isNaN(inputDate)) {
    response.sendStatus(200);
  } else {
    response.sendStatus(400);
  }
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
