package io.github.bevzyuk.jsocialflux.web.dto.photo.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UpdatePhotoRequest {
        private String description;
        private boolean descriptionPresent;

        @JsonProperty("description")
        public void setDescription(String description) {
                this.description = description;
                this.descriptionPresent = true;
        }

        public String getDescription() { return description; }
        public boolean isDescriptionPresent() { return descriptionPresent; }
}
