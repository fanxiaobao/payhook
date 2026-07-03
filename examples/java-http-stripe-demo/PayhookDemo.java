import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PayhookDemo {

    private static final Pattern EVENT_ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"(evt_[^\"]+)\"");
    private static final Pattern TYPE_PATTERN = Pattern.compile("\"type\"\\s*:\\s*\"([^\"]+)\"");
    private static final OrderState ORDER = new OrderState();
    private static final Set<String> PROCESSED_EVENT_IDS = new HashSet<>();
    private static boolean dedupeEnabled;

    public static void main(String[] args) throws IOException {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/webhooks/stripe", PayhookDemo::handleWebhook);
        server.createContext("/test/orders/order_123", PayhookDemo::handleOrderState);
        server.createContext("/test/ledger/order_123", PayhookDemo::handleLedgerState);
        server.createContext("/test/reset", PayhookDemo::handleReset);
        server.createContext("/test/mode/flawed", exchange -> handleMode(exchange, false));
        server.createContext("/test/mode/dedupe", exchange -> handleMode(exchange, true));
        server.start();

        System.out.println("PayHook Java demo listening on http://localhost:" + port);
        System.out.println("Webhook endpoint: http://localhost:" + port + "/webhooks/stripe");
        System.out.println("Mode: flawed. POST /test/mode/dedupe to enable event-id dedupe.");
    }

    private static void handleWebhook(HttpExchange exchange) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            respond(exchange, 405, "{\"error\":\"method not allowed\"}");
            return;
        }

        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        String eventId = extractEventId(body);
        String type = extractType(body);

        if (dedupeEnabled && PROCESSED_EVENT_IDS.contains(eventId)) {
            respond(exchange, 200, "{\"received\":true,\"duplicate\":true}");
            return;
        }
        if (dedupeEnabled) {
            PROCESSED_EVENT_IDS.add(eventId);
        }

        if ("checkout.session.completed".equals(type)) {
            ORDER.status = "PAID";
            ORDER.paidCount += 1;
            ORDER.fulfillmentCount += 1;
            ORDER.paymentEntries += 1;
        }

        respond(exchange, 200, "{\"received\":true}");
    }

    private static void handleOrderState(HttpExchange exchange) throws IOException {
        respond(exchange, 200, "{"
                + "\"status\":\"" + ORDER.status + "\","
                + "\"paidCount\":" + ORDER.paidCount + ","
                + "\"fulfillmentCount\":" + ORDER.fulfillmentCount + ","
                + "\"mode\":\"" + currentMode() + "\""
                + "}");
    }

    private static void handleLedgerState(HttpExchange exchange) throws IOException {
        respond(exchange, 200, "{"
                + "\"paymentEntries\":" + ORDER.paymentEntries + ","
                + "\"mode\":\"" + currentMode() + "\""
                + "}");
    }

    private static void handleReset(HttpExchange exchange) throws IOException {
        resetState();
        respond(exchange, 200, "{\"reset\":true,\"mode\":\"" + currentMode() + "\"}");
    }

    private static void handleMode(HttpExchange exchange, boolean enableDedupe) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            respond(exchange, 405, "{\"error\":\"method not allowed\"}");
            return;
        }

        dedupeEnabled = enableDedupe;
        resetState();
        respond(exchange, 200, "{\"mode\":\"" + currentMode() + "\",\"reset\":true}");
    }

    private static void resetState() {
        ORDER.status = "PENDING";
        ORDER.paidCount = 0;
        ORDER.fulfillmentCount = 0;
        ORDER.paymentEntries = 0;
        PROCESSED_EVENT_IDS.clear();
    }

    private static String extractEventId(String body) {
        Matcher matcher = EVENT_ID_PATTERN.matcher(body);
        return matcher.find() ? matcher.group(1) : "";
    }

    private static String extractType(String body) {
        Matcher matcher = TYPE_PATTERN.matcher(body);
        return matcher.find() ? matcher.group(1) : "";
    }

    private static String currentMode() {
        return dedupeEnabled ? "dedupe" : "flawed";
    }

    private static void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("content-type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    private static final class OrderState {
        private String status = "PENDING";
        private int paidCount;
        private int fulfillmentCount;
        private int paymentEntries;
    }
}
