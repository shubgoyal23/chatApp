FROM golang:1.25.4-alpine3.21 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -v -o app .

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/app .

EXPOSE 3000

CMD ["./app"]


