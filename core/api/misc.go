package api

import (
	"encoding/json"
	"net/http"

	"git.vrsal.cc/alex/iros/core/util"
	"git.vrsal.cc/alex/iros/core/web"
)

func SetAnnouncement(w http.ResponseWriter, r *http.Request) {
	authToken := r.Header.Get("Authorization")
	if authToken != util.Cfg.APIToken {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	type Request struct {
		Announcement      string `json:"announcement"`
		AnnouncementTitle string `json:"announcementTitle"`
	}

	var req Request
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	web.SetAnnouncement(req.AnnouncementTitle, req.Announcement)
}
