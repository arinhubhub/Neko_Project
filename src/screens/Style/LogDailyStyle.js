import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#E0F7FA', // Light cyan bg
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#00695C',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    questionText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#004D40',
        textAlign: 'center',
        marginBottom: 20,
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 24,
    },
    statusCard: {
        width: 140,
        height: 140,
        backgroundColor: '#80CBC4',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusCardActive: {
        borderWidth: 3,
        borderColor: '#00695C',
        backgroundColor: '#4DB6AC'
    },
    statusText: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#000',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Spread out
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 10,
        flex: 0.45, // Use percentage width for better spacing
        height: 40,
    },
    input: {
        flex: 1,
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 10,
        // borderWidth: 1, // Remove inner border to avoid double border look
        // borderColor: '#ccc',
        color: '#000',
    },
    unit: {
        color: '#999',
        marginLeft: 4,
    },
    selectorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // px or gap can be adjusted here if needed
    },
    levelBtn: {
        alignItems: 'center',
        width: 60,
    },
    iconImg: {
        width: 50, // Enlarged
        height: 50,
        resizeMode: 'contain',
        marginBottom: 8,
    },
    levelText: {
        fontSize: 10,
        color: '#555',
        textAlign: 'center',
    },
    
    /* Grid Styles */
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 12, // Space between items
    },
    gridItem: {
        width: '18%', // Approx 5 items per row with gap
        alignItems: 'center',
        marginBottom: 12,
    },
    gridIconBtn: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    gridIconBtnActive: {
        borderColor: '#00695C',
        backgroundColor: '#E0F2F1',
        borderWidth: 2,
    },
    gridLabel: {
        fontSize: 10,
        color: '#555',
        textAlign: 'center',
    },
    
    saveButton: {
        backgroundColor: '#80CBC4',
        paddingVertical: 14,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    circle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#80CBC4',
        marginBottom: 4,
    },
    circleActive: {
        backgroundColor: '#80CBC4',
    }
});
