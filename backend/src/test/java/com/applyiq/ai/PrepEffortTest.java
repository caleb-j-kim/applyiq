package com.applyiq.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PrepEffortTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void acceptsAnyCaseAndWritesFrontendLabel() throws Exception {
        // Generate requests send "LOW"; saved preps come back from the frontend as "Low".
        assertEquals(PrepEffort.LOW, json.readValue("\"LOW\"", PrepEffort.class));
        assertEquals(PrepEffort.MEDIUM, json.readValue("\"Medium\"", PrepEffort.class));
        assertEquals("\"High\"", json.writeValueAsString(PrepEffort.HIGH));
    }
}
