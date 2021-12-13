package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.LoadHTMLGlob("dist/*.html")
	r.Static("/pikpak/assets", "./dist/assets/")
	//router.LoadHTMLFiles("templates/template1.html", "templates/template2.html")
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"title": "Main website",
		})
	})
	r.Run(":8080") // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}
