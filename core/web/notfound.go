package web

import (
	"html/template"
	"net/http"
)

type NotFoundHandler struct{}

func (h *NotFoundHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	tmpl := template.Must(template.ParseFiles("templates/404.html"))
	w.WriteHeader(http.StatusNotFound)
	tmpl.Execute(w, nil)
}
