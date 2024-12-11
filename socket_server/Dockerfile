FROM golang:1.23.4-alpine3.21

WORKDIR /usr/src/app

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .
RUN go build -v -o /usr/local/bin/app .

EXPOSE 3000

CMD ["app"]


