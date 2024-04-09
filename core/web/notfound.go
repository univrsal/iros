package web

import (
	"html/template"
	"net/http"

	"git.vrsal.cc/alex/iros/core/util"
)

func notFoundPage(w http.ResponseWriter, _ *http.Request) {
	tmpl := template.Must(template.ParseFiles("templates/404.html", "templates/header.html"))
	w.WriteHeader(http.StatusNotFound)
	tmpl.Execute(w, util.Cfg)
}
